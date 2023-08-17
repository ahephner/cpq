//spell check out status
const spellCheck =(term)=>{
    return   term.startsWith('sou') && term != 'southern stock' ? 'southern stock' :
             term.startsWith('l') && term != 'limited' ? 'limited' :
             term.startsWith('c') && term != 'close-out' ? 'close-out' :
             term.startsWith('e') && term != 'exempt' ? 'exempt' :
             term.startsWith('s') && term != 'stock' ? 'stock' :
             term
}

const quickSearchString = (term, stock)=>{
    let searchString = 'FIND \''+term+'\' IN ALL FIELDS RETURNING Tag__c(id, Tag_Description__c, Search_Slug_2__c,'
                              +' Product__c, Product_Name__c, ATS_Score__c, Stock_Status__c where product__r.IsActive = true';
    
    stock != null ? searchString += ' and Stock_Status__c  = \''+stock+'\' order by ATS_Score__c desc nulls last)' :searchString += ' order by ATS_Score__c desc nulls last)'; 
    return searchString; 
  }

  const cpqSearchString = (term, stock) =>{
    let searchString = 'FIND \''+term+'\' IN ALL FIELDS RETURNING Tag__c(id, Tag_Description__c, Search_Slug_2__c, '
    +'Product__c, Product_Name__c, Product__r.Temp_Unavailable__c,Product__r.Temp_Mess__c, ATS_Score__c, Stock_Status__c, '
    +'W_Focus_Product__c, W_Product_Profitability__c, W_Program_Score__c, W_Inventory_Score__c, '
    +'Floor_Price__c, Product__r.Total_Product_Items__c,Product__r.Floor_Type__c, Product_Code__c where product__r.IsActive = true';
  
  stock != null ? searchString += ' and Stock_Status__c  = \''+stock+'\' order by ATS_Score__c desc nulls last)' :searchString += ' order by ATS_Score__c desc nulls last)'; 
  return searchString; 
  }

  const cpqSearchStringMobile = (term, stock) =>{
    let searchString = 'FIND \''+term+'\' IN ALL FIELDS RETURNING Tag__c(id, Tag_Description__c, Search_Slug_2__c, '
    +'Product__c, Product_Name__c, Product__r.Temp_Unavailable__c,Product__r.Temp_Mess__c, ATS_Score__c, Stock_Status__c, '
    +'W_Focus_Product__c, W_Product_Profitability__c, W_Program_Score__c, W_Inventory_Score__c, Product__r.Agency_Pricing__c, '
    +'Product__r.Ship_Weight__c, Product__r.Pallet_Qty__c, Product__r.SGN__c, Product__r.RUP__c, '
    +'Floor_Price__c, Product__r.Total_Product_Items__c,Product__r.Floor_Type__c, Product_Code__c where product__r.IsActive = true';
  
  stock != null ? searchString += ' and Stock_Status__c  = \''+stock+'\' order by ATS_Score__c desc nulls last)' :searchString += ' order by ATS_Score__c desc nulls last)'; 
  return searchString; 
  }
const uniqVals = (arr, track = new Set())=>{
  
  return  arr.filter(({Product__c})=>track.has(Product__c)? false: track.add(Product__c))
 
}
export{
       spellCheck,
       quickSearchString,
       cpqSearchString,
       uniqVals, 
       cpqSearchStringMobile
      }


///SEARCH STRING FOR ADDING IN STATUS FOR SEARCH
    //   let searchString = `FIND '${term}' IN ALL FIELDS RETURNING Tag__c(id, Tag_Description__c, Search_Slug_2__c,`
    //   +`Product__c, Product_Name__c, Product__r.Temp_Unavailable__c,Product__r.Temp_Mess__c, ATS_Score__c, Stock_Status__c, `
    //   +`W_Focus_Product__c, W_Product_Profitability__c, W_Program_Score__c, W_Inventory_Score__c, Floor_Price__c,`
    //   +`Product__r.Total_Product_Items__c,Product__r.Floor_Type__c, Product_Code__c where product__r.IsActive = true and Tag_Status__c = 'Active'`;
    //   stock != null ? searchString += `and Stock_Status__c  = '${stock}' order by ATS_Score__c desc nulls last)` :searchString +=` order by ATS_Score__c desc nulls last)`
    // return searchString; 
