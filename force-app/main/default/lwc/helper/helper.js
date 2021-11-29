  //used to merge inventory and selected products on load
   const mergeById = (a1, a2) =>{
    let merge = a1.map(itm => ({
                    ...a2.find((item) => (item.Product2Id === itm.Product2Id)),
                    ...itm
                })
                )
                return merge; 
            }
  const lineTotal = (units, charge)=> (units * charge).toFixed(2);

  const onLoadProducts = (products, recordId) =>{
      let prod = products.map(x =>{
        return   {
            sObjectType: 'OpportunityLineItem',
            Id: x.Id,
            PricebookEntryId: x.PricebookEntryId,
            Product2Id: x.Product2Id,
            name: x.Product2.Name,
            ProductCode: x.Product2.ProductCode,
            Quantity: x.Quantity,
            UnitPrice:x.UnitPrice,
            CPQ_Margin__c: x.Product2.Agency__c? '' : x.CPQ_Margin__c,
            Cost__c: x.Cost__c,
            agency: x.Product2.Agency__c,
            wInv: x.QuantityOnHand ? x.QuantityOnHand : 0,
            //lastPaid: this.newProd.Unit_Price__c,
            //lastMarg: (this.newProd.Margin__c / 100),
            TotalPrice: x.TotalPrice,
            OpportunityId: recordId
        }
      })
      return prod; 
  }
export{mergeById, lineTotal, onLoadProducts}