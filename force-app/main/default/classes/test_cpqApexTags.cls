@isTest
public class test_cpaApexTags {
 @isTest
    static void Test_getDetails(){
//odds and ends
		Date myDate = Date.newInstance(2040, 1, 4);
//account
		Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.RecordTypeId = '01241000001Dy64AAC'; 
        cust.Customer_Name__c = 'Test Customer 123456';
        insert cust;
//product
 		Product2 r1 = new Product2();
  		Product2 r2 = new Product2();         
         r1.Name='Product 1';
         r1.Primary_Category__c = 'Chemicals';
         r1.Subcategory__c ='Chemicals-Herbicide';
         r1.Include_in_Programs__c = True;
         r1.IsActive= True; 
         r1.ProductCode='123';
         r1.Product_Status__c ='Stock';
         r1.Size__c = 1;
         r1.Floor_Type__c ='Floor'; 
         r1.Floor_Price__c = 100;
         r1.IsActive = true; 
         
        
         r2.Name='Product 2';
         r2.Primary_Category__c = 'Chemicals';
         r2.Subcategory__c = 'Chemicals-Herbicide';
         r2.Include_in_Programs__c = True;
         r2.IsActive= True; 
         r2.ProductCode='123';
         r2.Product_Status__c ='Stock';
         r2.Size__c = 1;
         r2.Floor_Type__c ='Floor'; 
         r2.Floor_Price__c = 100;
     	insert r1; 
     	insert r2; 
//price book 
		Id pricebookId = Test.getStandardPricebookId();
//price book items
        PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r1.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
        PricebookEntry pbe2 = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r2.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);

        insert pbe;
        insert pbe2;
//location
        Schema.Location warehouse = new Schema.Location();
        warehouse.Name= 'ATS Warehouse';
        warehouse.Location_Number__c ='2';
        warehouse.IsInventoryLocation = true; 
        warehouse.LocationType = 'ATS'; 
        
        insert warehouse; 
//opportunity
        opportunity opp = new opportunity(name = 'test name', accountID= cust.id, pricebook2id = pricebookId,
                                         stagename='Working', Warehouse__c = warehouse.Id, closedate = myDate);
       
        //insert w/o synced quote
        insert opp; 
//opportunity line item
        opportunitylineitem li2 = new opportunitylineitem(opportunityid = opp.id, product2id = r1.Id, PricebookEntryId=pbe.id,
                                                         unitprice= 4, quantity= 3, CPQ_Unit_Price__c=5, CPQ_Margin__c=32); 
        insert li2; 
        opportunitylineitem widgetli2 = new opportunitylineitem(opportunityid = opp.id, product2id = r2.Id, PricebookEntryId=pbe2.id,
                                                         unitprice= 4, quantity= 3, CPQ_Unit_Price__c=100, CPQ_Margin__c=35); 
        insert widgetli2;
//product items
		ProductItem inv1 = new ProductItem(Product2Id = r1.id, LocationId= warehouse.id, QuantityOnHand= 3);
        ProductItem inv2 = new ProductItem(Product2Id = r2.id, LocationId= warehouse.id, QuantityOnHand= 4);
        insert inv1; 
        insert inv2; 
//Because ATS Products is used in reporting need an ats product
		Product__c ats1 = new Product__c(Name= r1.ProductCode, Product_Name__c = r1.Name, active__c = True, Product_Code__c = r1.ProductCode); 
        Product__c ats2 = new Product__c(Name= r2.ProductCode, Product_Name__c = r2.Name, active__c = True, Product_Code__c = r2.ProductCode); 
        insert ats1;
        insert ats2; 
//sales doc and details
 account ques = [select id, Type,Name   from account where id =: cust.id limit 1];
        system.debug('###'+ques);
		Sales_Document__c header = new Sales_Document__c();
        	header.Sales_Doc_Num__c = 'SO132';
        	header.Customer__c = cust.Id; 
        	header.Doc_Type__c = 'Invoice';
        	header.Doc_Date__c = MyDate.addDays(-10);
        	header.Number_of_Payments__c = 1;
        insert header; 
        
        Sales_Doc_Detail__c detail1 = new Sales_Doc_Detail__c();
        Sales_Doc_Detail__c detail2 = new Sales_Doc_Detail__c();
        	detail1.Sales_Document__c = header.Id; 
        	detail1.Name = 'detail 1'; 
        	detail1.Quantity__c  = 1;
        	detail1.Product__c = ats1.Id; 
        
            detail2.Sales_Document__c = header.Id; 
        	detail2.Name = 'detail 1'; 
        	detail2.Quantity__c  = 1;
        	detail2.Product__c = ats2.Id;
//Test
		test.startTest();
        	//prodWrapper take1 = cpqApexTags.prodWrapper();  
        	list<cpqApexTags.prodWrapper> detail = cpqApexTags.getDetails(r1.Id, warehouse.Id, cust.Id, r1.ProductCode,opp.Id, pricebookId);
        test.stopTest(); 
//Verify
	system.assertNotEquals(detail, null); 
    }
}